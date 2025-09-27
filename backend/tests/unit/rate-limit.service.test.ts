import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimitService } from '../../src/services/rate-limit.service';
import { redis } from '../../src/config/redis';

vi.mock('../../src/config/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    del: vi.fn(),
    multi: vi.fn(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn()
    }))
  }
}));

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  beforeEach(() => {
    rateLimitService = new RateLimitService();
    vi.clearAllMocks();
  });

  describe('checkLimit', () => {
    it('should allow request when under limit', async () => {
      const userId = 'user123';
      const endpoint = '/api/test';
      
      vi.mocked(redis.get).mockResolvedValueOnce('5'); // Current count
      
      const result = await rateLimitService.checkLimit(userId, endpoint);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(95); // 100 - 5
      expect(result.resetAt).toBeDefined();
    });

    it('should deny request when limit exceeded', async () => {
      const userId = 'user123';
      const endpoint = '/api/test';
      
      vi.mocked(redis.get).mockResolvedValueOnce('100'); // At limit
      
      const result = await rateLimitService.checkLimit(userId, endpoint);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should initialize counter for new user', async () => {
      const userId = 'newuser';
      const endpoint = '/api/test';
      
      vi.mocked(redis.get).mockResolvedValueOnce(null); // No existing count
      
      const mockMulti = {
        incr: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValueOnce([[null, 1], [null, 'OK']])
      };
      
      vi.mocked(redis.multi).mockReturnValueOnce(mockMulti as any);
      
      const result = await rateLimitService.checkLimit(userId, endpoint);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });
  });

  describe('consumeToken', () => {
    it('should consume token from bucket', async () => {
      const bucketKey = 'bucket:user123';
      
      vi.mocked(redis.get).mockResolvedValueOnce('10'); // Available tokens
      vi.mocked(redis.incr).mockResolvedValueOnce(9);
      
      const consumed = await rateLimitService.consumeToken(bucketKey);
      
      expect(consumed).toBe(true);
      expect(redis.incr).toHaveBeenCalledWith(bucketKey);
    });

    it('should not consume token when bucket is empty', async () => {
      const bucketKey = 'bucket:user123';
      
      vi.mocked(redis.get).mockResolvedValueOnce('0'); // No tokens
      
      const consumed = await rateLimitService.consumeToken(bucketKey);
      
      expect(consumed).toBe(false);
      expect(redis.incr).not.toHaveBeenCalled();
    });
  });

  describe('refillBucket', () => {
    it('should refill token bucket', async () => {
      const bucketKey = 'bucket:user123';
      const tokensToAdd = 5;
      const maxTokens = 100;
      
      vi.mocked(redis.get).mockResolvedValueOnce('95'); // Current tokens
      vi.mocked(redis.set).mockResolvedValueOnce('OK');
      
      await rateLimitService.refillBucket(bucketKey, tokensToAdd, maxTokens);
      
      expect(redis.set).toHaveBeenCalledWith(bucketKey, '100', 'EX', 3600);
    });

    it('should not exceed max tokens when refilling', async () => {
      const bucketKey = 'bucket:user123';
      const tokensToAdd = 10;
      const maxTokens = 100;
      
      vi.mocked(redis.get).mockResolvedValueOnce('98'); // Current tokens
      vi.mocked(redis.set).mockResolvedValueOnce('OK');
      
      await rateLimitService.refillBucket(bucketKey, tokensToAdd, maxTokens);
      
      expect(redis.set).toHaveBeenCalledWith(bucketKey, '100', 'EX', 3600);
    });
  });

  describe('getRemainingLimit', () => {
    it('should get remaining limit for user', async () => {
      const userId = 'user123';
      const endpoint = '/api/test';
      
      vi.mocked(redis.get).mockResolvedValueOnce('30'); // Current count
      vi.mocked(redis.ttl).mockResolvedValueOnce(1800); // 30 minutes TTL
      
      const result = await rateLimitService.getRemainingLimit(userId, endpoint);
      
      expect(result.remaining).toBe(70); // 100 - 30
      expect(result.resetIn).toBe(1800);
    });

    it('should return full limit when no usage', async () => {
      const userId = 'user123';
      const endpoint = '/api/test';
      
      vi.mocked(redis.get).mockResolvedValueOnce(null); // No usage
      
      const result = await rateLimitService.getRemainingLimit(userId, endpoint);
      
      expect(result.remaining).toBe(100);
      expect(result.resetIn).toBe(3600); // Default window
    });
  });

  describe('resetLimit', () => {
    it('should reset rate limit for user', async () => {
      const userId = 'user123';
      const endpoint = '/api/test';
      
      vi.mocked(redis.del).mockResolvedValueOnce(1);
      
      await rateLimitService.resetLimit(userId, endpoint);
      
      expect(redis.del).toHaveBeenCalledWith(`rate_limit:${userId}:${endpoint}`);
    });
  });

  describe('applyPolicy', () => {
    it('should apply custom rate limit policy', async () => {
      const userId = 'user123';
      const policy = {
        maxRequests: 200,
        windowMs: 60000,
        burstLimit: 20
      };
      
      vi.mocked(redis.set).mockResolvedValueOnce('OK');
      
      await rateLimitService.applyPolicy(userId, policy);
      
      expect(redis.set).toHaveBeenCalledWith(
        `rate_policy:${userId}`,
        JSON.stringify(policy),
        'EX',
        86400
      );
    });
  });

  describe('getPolicy', () => {
    it('should retrieve custom policy for user', async () => {
      const userId = 'user123';
      const policy = {
        maxRequests: 200,
        windowMs: 60000,
        burstLimit: 20
      };
      
      vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(policy));
      
      const result = await rateLimitService.getPolicy(userId);
      
      expect(result).toEqual(policy);
    });

    it('should return default policy when no custom policy', async () => {
      const userId = 'user123';
      
      vi.mocked(redis.get).mockResolvedValueOnce(null);
      
      const result = await rateLimitService.getPolicy(userId);
      
      expect(result).toEqual({
        maxRequests: 100,
        windowMs: 3600000,
        burstLimit: 10
      });
    });
  });
});