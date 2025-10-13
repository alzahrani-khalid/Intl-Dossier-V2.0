import { Redis } from '@upstash/redis';

/**
 * Session Invalidation Utility
 *
 * Handles Redis-based session invalidation when user roles change.
 * Implements whitelist-based session validation:
 * - Active sessions are stored in Redis with expiration
 * - On role change, all user sessions are removed from whitelist
 * - Users must re-authenticate to continue
 *
 * Performance target: <30 seconds for session invalidation to take effect
 */

// Redis client from config
let redisClient: Redis | null = null;

/**
 * Initialize Redis client
 */
export function initializeRedis(client: Redis) {
  redisClient = client;
}

/**
 * Get Redis session key for a user
 */
function getUserSessionKey(userId: string): string {
  return `user:${userId}:sessions`;
}

/**
 * Get Redis session whitelist key for a specific session
 */
function getSessionWhitelistKey(sessionId: string): string {
  return `session:${sessionId}:whitelisted`;
}

/**
 * Add a session to the whitelist
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 * @param expiresIn - Expiration time in seconds (default: 24 hours)
 */
export async function whitelistSession(
  userId: string,
  sessionId: string,
  expiresIn: number = 86400
): Promise<void> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const userSessionsKey = getUserSessionKey(userId);
  const sessionWhitelistKey = getSessionWhitelistKey(sessionId);

  // Add session to user's session set
  await redisClient.sadd(userSessionsKey, sessionId);

  // Set session whitelist flag with expiration
  await redisClient.setex(sessionWhitelistKey, expiresIn, '1');

  // Set expiration on user sessions set (will be refreshed on each session addition)
  await redisClient.expire(userSessionsKey, expiresIn);
}

/**
 * Check if a session is whitelisted
 *
 * @param sessionId - Session ID to check
 * @returns true if session is whitelisted, false otherwise
 */
export async function isSessionWhitelisted(sessionId: string): Promise<boolean> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const sessionWhitelistKey = getSessionWhitelistKey(sessionId);
  const result = await redisClient.get(sessionWhitelistKey);

  return result === '1';
}

/**
 * Invalidate all sessions for a user (e.g., on role change)
 *
 * This removes all user sessions from the whitelist, forcing re-authentication.
 * The invalidation takes effect immediately (within Redis propagation time).
 *
 * @param userId - User ID whose sessions should be invalidated
 * @returns Number of sessions invalidated
 */
export async function invalidateUserSessions(userId: string): Promise<number> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const userSessionsKey = getUserSessionKey(userId);

  // Get all session IDs for the user
  const sessionIds = await redisClient.smembers(userSessionsKey);

  if (!sessionIds || sessionIds.length === 0) {
    return 0;
  }

  // Delete all session whitelist entries
  const deletePromises = sessionIds.map((sessionId) => {
    const sessionWhitelistKey = getSessionWhitelistKey(sessionId);
    return redisClient!.del(sessionWhitelistKey);
  });

  await Promise.all(deletePromises);

  // Delete the user sessions set
  await redisClient.del(userSessionsKey);

  return sessionIds.length;
}

/**
 * Invalidate a specific session
 *
 * @param userId - User ID
 * @param sessionId - Session ID to invalidate
 */
export async function invalidateSession(userId: string, sessionId: string): Promise<void> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const userSessionsKey = getUserSessionKey(userId);
  const sessionWhitelistKey = getSessionWhitelistKey(sessionId);

  // Remove session from user's session set
  await redisClient.srem(userSessionsKey, sessionId);

  // Delete session whitelist entry
  await redisClient.del(sessionWhitelistKey);
}

/**
 * Get all active session IDs for a user
 *
 * @param userId - User ID
 * @returns Array of active session IDs
 */
export async function getUserActiveSessions(userId: string): Promise<string[]> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const userSessionsKey = getUserSessionKey(userId);
  const sessionIds = await redisClient.smembers(userSessionsKey);

  if (!sessionIds || sessionIds.length === 0) {
    return [];
  }

  // Filter out expired sessions
  const validSessions: string[] = [];

  for (const sessionId of sessionIds) {
    const isValid = await isSessionWhitelisted(sessionId);
    if (isValid) {
      validSessions.push(sessionId);
    } else {
      // Clean up invalid session from set
      await redisClient.srem(userSessionsKey, sessionId);
    }
  }

  return validSessions;
}

/**
 * Refresh session expiration
 *
 * @param sessionId - Session ID to refresh
 * @param expiresIn - New expiration time in seconds (default: 24 hours)
 */
export async function refreshSession(sessionId: string, expiresIn: number = 86400): Promise<void> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const sessionWhitelistKey = getSessionWhitelistKey(sessionId);

  // Check if session exists before refreshing
  const exists = await redisClient.exists(sessionWhitelistKey);

  if (exists) {
    await redisClient.expire(sessionWhitelistKey, expiresIn);
  }
}

/**
 * Cleanup expired sessions for a user
 *
 * This is a maintenance function that should be called periodically
 * to remove stale session references from the user sessions set.
 *
 * @param userId - User ID
 * @returns Number of expired sessions cleaned up
 */
export async function cleanupExpiredSessions(userId: string): Promise<number> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const userSessionsKey = getUserSessionKey(userId);
  const sessionIds = await redisClient.smembers(userSessionsKey);

  if (!sessionIds || sessionIds.length === 0) {
    return 0;
  }

  let cleanedCount = 0;

  for (const sessionId of sessionIds) {
    const isValid = await isSessionWhitelisted(sessionId);
    if (!isValid) {
      await redisClient.srem(userSessionsKey, sessionId);
      cleanedCount++;
    }
  }

  return cleanedCount;
}

/**
 * Get session statistics for a user
 *
 * @param userId - User ID
 * @returns Session statistics (total, active, expired)
 */
export async function getUserSessionStats(userId: string): Promise<{
  total: number;
  active: number;
  expired: number;
}> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const userSessionsKey = getUserSessionKey(userId);
  const sessionIds = await redisClient.smembers(userSessionsKey);

  if (!sessionIds || sessionIds.length === 0) {
    return { total: 0, active: 0, expired: 0 };
  }

  let activeCount = 0;

  for (const sessionId of sessionIds) {
    const isValid = await isSessionWhitelisted(sessionId);
    if (isValid) {
      activeCount++;
    }
  }

  return {
    total: sessionIds.length,
    active: activeCount,
    expired: sessionIds.length - activeCount,
  };
}
