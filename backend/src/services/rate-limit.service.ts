import Redis from 'ioredis';
import { RateLimitPolicy, RateLimitPolicyInput, RateLimitPolicyModel, TokenBucketState } from '../models/rate-limit-policy.model';
import { createClient } from '@supabase/supabase-js';

interface RateLimitStatus {
  user_id?: string;
  ip_address?: string;
  limits: {
    endpoint_type: string;
    requests_used: number;
    requests_limit: number;
    reset_at: Date;
    burst_remaining: number;
  }[];
}

export class RateLimitService {
  private redis: Redis;
  private supabase: any;
  private policies: Map<string, RateLimitPolicy> = new Map();
  
  constructor(
    redisUrl: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.redis = new Redis(redisUrl);
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.loadPolicies();
  }
  
  private async loadPolicies(): Promise<void> {
    const { data, error } = await this.supabase
      .from('rate_limit_policies')
      .select('*')
      .eq('enabled', true);
    
    if (error) {
      console.error('Failed to load rate limit policies:', error);
      return;
    }
    
    data.forEach((policy: RateLimitPolicy) => {
      const key = `${policy.applies_to}:${policy.endpoint_type}`;
      this.policies.set(key, policy);
    });
  }
  
  async createPolicy(input: RateLimitPolicyInput): Promise<RateLimitPolicy> {
    const validationErrors = RateLimitPolicyModel.validate(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    const { data, error } = await this.supabase
      .from('rate_limit_policies')
      .insert({
        ...input,
        retry_after_seconds: input.retry_after_seconds || RateLimitPolicyModel.DEFAULT_RETRY_AFTER,
        enabled: input.enabled ?? true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create policy: ${error.message}`);
    }
    
    await this.loadPolicies();
    return data;
  }
  
  async updatePolicy(id: string, input: Partial<RateLimitPolicyInput>): Promise<RateLimitPolicy> {
    const validationErrors = RateLimitPolicyModel.validate(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    const { data, error } = await this.supabase
      .from('rate_limit_policies')
      .update({
        ...input,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update policy: ${error.message}`);
    }
    
    await this.loadPolicies();
    return data;
  }
  
  async deletePolicy(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('rate_limit_policies')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
    
    await this.loadPolicies();
  }
  
  async checkRateLimit(
    userId?: string,
    ip?: string,
    endpointType: string = 'api'
  ): Promise<{
    allowed: boolean;
    remaining: number;
    reset_at: Date;
    retry_after?: number;
  }> {
    const policy = this.getApplicablePolicy(endpointType, userId);
    if (!policy) {
      return {
        allowed: true,
        remaining: Infinity,
        reset_at: new Date()
      };
    }
    
    const cacheKey = RateLimitPolicyModel.getCacheKey(userId, ip, endpointType);
    const state = await this.getTokenBucketState(cacheKey, policy);
    
    const result = RateLimitPolicyModel.consumeTokens(state, policy);
    
    await this.saveTokenBucketState(cacheKey, state);
    
    const resetAt = new Date();
    resetAt.setSeconds(resetAt.getSeconds() + 60);
    
    return {
      allowed: result.allowed,
      remaining: result.tokens_remaining,
      reset_at: resetAt,
      retry_after: result.retry_after
    };
  }
  
  private getApplicablePolicy(endpointType: string, userId?: string): RateLimitPolicy | null {
    const userKey = userId ? 'authenticated' : 'anonymous';
    
    let policy = this.policies.get(`${userKey}:${endpointType}`);
    if (!policy) {
      policy = this.policies.get(`${userKey}:all`);
    }
    
    if (!policy) {
      const defaults = RateLimitPolicyModel.getDefaultPolicy(userKey as any);
      policy = {
        id: 'default',
        name: `Default ${userKey} policy`,
        ...defaults,
        endpoint_type: 'all',
        applies_to: userKey as any,
        requests_per_minute: defaults.requests_per_minute!,
        burst_capacity: defaults.burst_capacity!,
        retry_after_seconds: defaults.retry_after_seconds!,
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      } as RateLimitPolicy;
    }
    
    return policy;
  }
  
  private async getTokenBucketState(
    key: string,
    policy: RateLimitPolicy
  ): Promise<TokenBucketState> {
    const data = await this.redis.get(key);
    
    if (data) {
      const state = JSON.parse(data);
      state.last_refill = new Date(state.last_refill);
      return state;
    }
    
    return {
      tokens: policy.burst_capacity,
      last_refill: new Date()
    };
  }
  
  private async saveTokenBucketState(
    key: string,
    state: TokenBucketState
  ): Promise<void> {
    await this.redis.set(
      key,
      JSON.stringify(state),
      'EX',
      3600
    );
  }
  
  async getRateLimitStatus(
    userId?: string,
    ip?: string
  ): Promise<RateLimitStatus> {
    const endpointTypes = ['api', 'upload', 'report'];
    const limits = [];
    
    for (const endpointType of endpointTypes) {
      const policy = this.getApplicablePolicy(endpointType, userId);
      if (!policy) continue;
      
      const cacheKey = RateLimitPolicyModel.getCacheKey(userId, ip, endpointType);
      const state = await this.getTokenBucketState(cacheKey, policy);
      
      const resetAt = new Date();
      resetAt.setSeconds(resetAt.getSeconds() + 60);
      
      limits.push({
        endpoint_type: endpointType,
        requests_used: policy.burst_capacity - state.tokens,
        requests_limit: policy.requests_per_minute,
        reset_at: resetAt,
        burst_remaining: state.tokens
      });
    }
    
    return {
      user_id: userId,
      ip_address: ip,
      limits
    };
  }
  
  async resetRateLimit(userId?: string, ip?: string): Promise<void> {
    const pattern = userId 
      ? `rate_limit:user:${userId}:*`
      : `rate_limit:ip:${ip}:*`;
    
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  async getAllPolicies(
    appliesTo?: RateLimitPolicy['applies_to']
  ): Promise<RateLimitPolicy[]> {
    let query = this.supabase
      .from('rate_limit_policies')
      .select('*');
    
    if (appliesTo) {
      query = query.eq('applies_to', appliesTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get policies: ${error.message}`);
    }
    
    return data;
  }
  
  async applyBurstLimit(
    burst: number,
    userId?: string,
    ip?: string
  ): Promise<boolean> {
    const policy = this.getApplicablePolicy('api', userId);
    if (!policy) return true;
    
    const cacheKey = RateLimitPolicyModel.getCacheKey(userId, ip, 'api');
    const state = await this.getTokenBucketState(cacheKey, policy);
    
    const result = RateLimitPolicyModel.consumeTokens(state, policy, burst);
    
    if (result.allowed) {
      await this.saveTokenBucketState(cacheKey, state);
    }
    
    return result.allowed;
  }
  
  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}