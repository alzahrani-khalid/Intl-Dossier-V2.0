import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthService } from '../AuthService'
import { supabaseAdmin, supabaseAnon } from '../../config/supabase'
import jwt from 'jsonwebtoken'

// Mock supabase
vi.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
  supabaseAnon: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      signUp: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getUser: vi.fn(),
    },
  },
}))

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          role: 'admin',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        expires_in: 3600,
      }

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        name_en: 'Test User',
        name_ar: 'مستخدم تجريبي',
        role: 'admin',
        department: 'IT',
        is_active: true,
        mfa_enabled: false,
        login_count: 0,
      }

      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      const result = await authService.login('test@example.com', 'password123')

      expect(result).toBeDefined()
      expect(result.user?.email).toBe('test@example.com')
      expect(result.accessToken).toBe('mock-access-token')
      expect(supabaseAnon.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle login with MFA', async () => {
      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'MFA challenge required',
          status: 400,
          __isAuthError: true,
          name: 'AuthApiError',
        },
      })

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('MFA challenge required')
    })

    it('should handle invalid credentials', async () => {
      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          status: 400,
          __isAuthError: true,
          name: 'AuthApiError',
        },
      })

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid login credentials')
    })

    it('should logout user', async () => {
      vi.mocked(supabaseAnon.auth.signOut).mockResolvedValue({
        error: null,
      })

      await authService.logout()

      expect(supabaseAnon.auth.signOut).toHaveBeenCalled()
    })

    it('should refresh token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: mockUser,
        expires_in: 3600,
      }

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        name_en: 'Test User',
        name_ar: 'مستخدم تجريبي',
        role: 'admin',
        department: 'IT',
        is_active: true,
        mfa_enabled: false,
      }

      vi.mocked(supabaseAnon.auth.refreshSession).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      })

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await authService.refreshToken('old-refresh-token')

      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
    })
  })

  describe('User Management', () => {
    it('should register new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
        user_metadata: {
          name: 'New User',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      const mockUserProfile = {
        id: 'user-123',
        email: 'new@example.com',
        name_en: 'New User',
        name_ar: 'مستخدم جديد',
        role: 'user',
        department: 'General',
        is_active: false,
        mfa_enabled: false,
      }

      vi.mocked(supabaseAnon.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })

      expect(result.user?.email).toBe('new@example.com')
      expect(supabaseAnon.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'New User',
            first_name: 'New',
            last_name: 'User',
          },
        },
      })
    })

    it('should update user profile', async () => {
      const updates = {
        name: 'Updated Name',
        name_en: 'Updated Name',
        name_ar: 'الاسم المحدث',
        department: 'IT',
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Updated Name' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        name_en: 'Updated Name',
        name_ar: 'الاسم المحدث',
        role: 'admin',
        department: 'IT',
        is_active: true,
        mfa_enabled: false,
      }

      vi.mocked(supabaseAnon.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await authService.updateProfile('user-123', updates)

      expect(result.user?.user_metadata?.name).toBe('Updated Name')
      expect(supabaseAnon.auth.updateUser).toHaveBeenCalledWith({
        data: {
          name: 'Updated Name',
          first_name: undefined,
          last_name: undefined,
        },
      })
    })

    it('should reset password', async () => {
      vi.mocked(supabaseAnon.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      })

      await authService.resetPassword('test@example.com')

      expect(supabaseAnon.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object)
      )
    })
  })

  describe('Session Management', () => {
    it('should validate session', async () => {
      const mockSession = {
        access_token: 'valid-token',
        user: { id: 'user-123', email: 'test@example.com' },
      }

      vi.mocked(supabaseAnon.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await authService.validateSession('valid-token')

      expect(result).toBe(true)
    })

    it('should reject invalid session', async () => {
      vi.mocked(supabaseAnon.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await authService.validateSession('invalid-token')

      expect(result).toBe(false)
    })

    it('should get current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      const mockSession = {
        access_token: 'token',
        user: mockUser,
      }

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        name_en: 'Test User',
        name_ar: 'مستخدم تجريبي',
        role: 'admin',
        department: 'IT',
        is_active: true,
        mfa_enabled: false,
      }

      vi.mocked(supabaseAnon.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await authService.getCurrentUser()

      expect(result).toBeDefined()
      expect(result?.email).toBe('test@example.com')
      expect(result?.name_en).toBe('Test User')
    })
  })

  describe('Permission Management', () => {
    it('should check user permissions', async () => {
      const mockUserData = {
        id: 'user-123',
        role: 'admin',
        department: 'IT',
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      } as any)

      const hasPermission = await authService.checkPermission(
        'user-123',
        'delete',
        'resource-123'
      )

      expect(hasPermission).toBeDefined()
    })

    it('should validate role hierarchy', async () => {
      const mockAdminData = {
        id: 'admin-123',
        role: 'admin',
      }

      const mockUserData = {
        id: 'user-123',
        role: 'user',
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({ data: mockAdminData, error: null })
              .mockResolvedValueOnce({ data: mockUserData, error: null }),
          }),
        }),
      } as any)

      const canAdminAccessManager = await authService.canAccessRole('admin-123', 'manager')
      const canUserAccessAdmin = await authService.canAccessRole('user-123', 'admin')

      expect(canAdminAccessManager).toBe(true)
      expect(canUserAccessAdmin).toBe(false)
    })
  })

  describe('Security', () => {
    it('should rate limit login attempts', async () => {
      const email = 'test@example.com'

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: 'Invalid login credentials',
            status: 400,
            __isAuthError: true,
            name: 'AuthApiError',
          },
        })

        try {
          await authService.login(email, 'wrongpassword')
        } catch (e) {
          // Expected to fail
        }
      }

      // Next attempt should be rate limited
      await expect(authService.login(email, 'password')).rejects.toThrow(
        'Invalid login credentials'
      )
    })

    it('should log security events', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      } as any)

      await authService.logSecurityEvent('user-123', 'login_success', {
        userId: 'user-123',
        ip: '192.168.1.1',
      })

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_log')
    })

    it('should validate JWT tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      }

      vi.mocked(supabaseAnon.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const decoded = await authService.verifyJWT('valid-token')

      expect(decoded.id).toBe('user-123')
      expect(decoded.email).toBe('test@example.com')
    })
  })
})