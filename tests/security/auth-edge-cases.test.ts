/**
 * Auth middleware edge case tests
 *
 * Tests authentication edge cases:
 * - Missing token returns 401
 * - Expired token returns 401
 * - Valid token populates req.user with org_id from profiles
 * - Inactive user returns 401
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { createMockRequest, createMockResponse, createMockNext, TEST_ORG_A_ID } from './test-helpers'

// Mock supabaseAdmin before importing auth middleware
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('../../backend/src/config/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

// Mock logger to avoid side effects
vi.mock('../../backend/src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

// Import after mocks are set up
import { authenticateToken } from '../../backend/src/middleware/auth'

describe('Auth middleware edge cases', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction & ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = createMockRequest()
    mockRes = createMockResponse()
    mockNext = createMockNext()

    // Set up default chain: from().select().eq().single()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  it('should return 401 when no Authorization header is present', async () => {
    mockReq.headers = {}

    await authenticateToken(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'UnauthorizedError',
        message: 'No token provided',
      }),
    )
  })

  it('should return 401 when Authorization header has no token', async () => {
    mockReq.headers = { authorization: 'Bearer ' }

    await authenticateToken(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'UnauthorizedError',
      }),
    )
  })

  it('should return 401 with expired/invalid token message when both auth strategies fail', async () => {
    mockReq.headers = { authorization: 'Bearer invalid-token-123' }

    // Supabase auth fails
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    })

    await authenticateToken(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'UnauthorizedError',
      }),
    )
  })

  it('should return 401 when user is inactive', async () => {
    mockReq.headers = { authorization: 'Bearer valid-supabase-token' }

    // Supabase auth succeeds
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    })

    // Users table: user exists but inactive
    // First call to from('users')
    let fromCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      fromCallCount++
      return { select: mockSelect }
    })

    mockSingle.mockImplementation(() => {
      // Alternate between users table (first call) and profiles table (second call)
      if (fromCallCount <= 1) {
        return Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'viewer',
            full_name: 'Test User',
            department: 'Test',
            is_active: false,
            permissions: [],
          },
          error: null,
        })
      }
      return Promise.resolve({
        data: {
          organization_id: TEST_ORG_A_ID,
          clearance_level: 1,
          role: 'viewer',
        },
        error: null,
      })
    })

    await authenticateToken(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'UnauthorizedError',
        message: 'Account is inactive',
      }),
    )
  })

  it('should populate req.user with organization_id from profiles on valid auth', async () => {
    mockReq.headers = { authorization: 'Bearer valid-supabase-token' }

    // Supabase auth succeeds
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    })

    // Track which table is being queried
    let callIndex = 0
    mockFrom.mockImplementation((table: string) => {
      callIndex++
      return { select: mockSelect }
    })

    mockSingle.mockImplementation(() => {
      if (callIndex === 1) {
        // First call: users table
        return Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'editor',
            full_name: 'Test User',
            department: 'Diplomacy',
            is_active: true,
            permissions: ['read:countries'],
          },
          error: null,
        })
      }
      // Second call: profiles table
      return Promise.resolve({
        data: {
          organization_id: TEST_ORG_A_ID,
          clearance_level: 3,
          role: 'editor',
        },
        error: null,
      })
    })

    await authenticateToken(mockReq as Request, mockRes as Response, mockNext)

    // Should call next() without error
    expect(mockNext).toHaveBeenCalledWith()

    // Should populate req.user with profile data
    expect(mockReq.user).toBeDefined()
    expect(mockReq.user!.organization_id).toBe(TEST_ORG_A_ID)
    expect(mockReq.user!.clearance_level).toBe(3)
    expect(mockReq.user!.role).toBe('editor')
    expect(mockReq.user!.permissions).toEqual(['read:countries'])
    expect(mockReq.user!.email).toBe('test@example.com')
  })

  it('should return 401 when user has no organization in profiles', async () => {
    mockReq.headers = { authorization: 'Bearer valid-supabase-token' }

    // Supabase auth succeeds
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    })

    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      return { select: mockSelect }
    })

    mockSingle.mockImplementation(() => {
      if (callIndex === 1) {
        // Users table: active user
        return Promise.resolve({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'viewer',
            full_name: null,
            department: null,
            is_active: true,
            permissions: [],
          },
          error: null,
        })
      }
      // Profiles table: no profile found
      return Promise.resolve({
        data: null,
        error: { message: 'No rows found' },
      })
    })

    await authenticateToken(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'UnauthorizedError',
        message: 'User profile incomplete - no organization assigned',
      }),
    )
  })
})
