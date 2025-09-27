import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService, User, LoginResult, MFASetupResult } from '../../src/services/AuthService';
import { supabaseAdmin, supabaseAnon } from '../../src/config/supabase';
import { cacheHelpers } from '../../src/config/redis';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn()
    }
  },
  supabaseAnon: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn()
    }
  }
}));

vi.mock('../../src/config/redis', () => ({
  cacheHelpers: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn()
  }
}));

vi.mock('speakeasy', () => ({
  generateSecret: vi.fn(),
  verify: vi.fn()
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn()
}));

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn()
}));

vi.mock('jsonwebtoken', () => ({
  verify: vi.fn()
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUser: User;

  beforeEach(() => {
    authService = new AuthService();
    mockUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@gastat.gov.sa',
      name_en: 'Test User',
      name_ar: 'مستخدم تجريبي',
      role: 'user',
      department: 'IT',
      is_active: true,
      mfa_enabled: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials in test mode', async () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      const email = 'admin@gastat.gov.sa';
      const password = 'admin123';

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(email);
      expect(result.user?.role).toBe('super_admin');
    });

    it('should throw error for invalid credentials in test mode', async () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      const email = 'invalid@gastat.gov.sa';
      const password = 'wrongpassword';

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow();
    });

    it('should handle Supabase login successfully', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const email = 'test@gastat.gov.sa';
      const password = 'password123';
      const mockSession = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 3600,
        user: { id: 'user-id', email: email }
      };

      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null
      });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-id',
                name_en: 'Test User',
                name_ar: 'مستخدم تجريبي',
                role: 'user',
                department: 'IT',
                is_active: true,
                mfa_enabled: false,
                login_count: 0
              },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      } as any);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('access_token');
    });

    it('should handle MFA requirement', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const email = 'test@gastat.gov.sa';
      const password = 'password123';

      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: 'user-id' }, session: { access_token: 'token' } },
        error: null
      });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-id',
                name_en: 'Test User',
                name_ar: 'مستخدم تجريبي',
                role: 'user',
                department: 'IT',
                is_active: true,
                mfa_enabled: true,
                mfa_secret: 'secret'
              },
              error: null
            })
          })
        })
      } as any);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('MFA code required');
    });

    it('should handle inactive user', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const email = 'test@gastat.gov.sa';
      const password = 'password123';

      vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: 'user-id' }, session: { access_token: 'token' } },
        error: null
      });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-id',
                name_en: 'Test User',
                name_ar: 'مستخدم تجريبي',
                role: 'user',
                department: 'IT',
                is_active: false,
                mfa_enabled: false
              },
              error: null
            })
          })
        })
      } as any);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Account is inactive');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'refresh_token';
      const mockSession = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
        user: { id: 'user-id', email: 'test@gastat.gov.sa' }
      };

      vi.mocked(supabaseAnon.auth.refreshSession).mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null
      });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-id',
                name_en: 'Test User',
                name_ar: 'مستخدم تجريبي',
                role: 'user',
                department: 'IT',
                is_active: true,
                mfa_enabled: false
              },
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new_access_token');
    });

    it('should handle invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid_token';

      vi.mocked(supabaseAnon.auth.refreshSession).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid refresh token' }
      });

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      vi.mocked(supabaseAnon.auth.signOut).mockResolvedValue({ error: null });

      // Act
      const result = await authService.logout();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle logout error', async () => {
      // Arrange
      vi.mocked(supabaseAnon.auth.signOut).mockResolvedValue({
        error: { message: 'Logout failed' }
      });

      // Act
      const result = await authService.logout();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Logout failed');
    });
  });

  describe('setupMFA', () => {
    it('should setup MFA successfully', async () => {
      // Arrange
      const userId = 'user-id';
      const mockSecret = {
        base32: 'secret123',
        otpauth_url: 'otpauth://totp/test@example.com?secret=secret123'
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                email: 'test@gastat.gov.sa',
                name_en: 'Test User',
                mfa_enabled: false
              },
              error: null
            })
          })
        })
      } as any);

      vi.mocked(speakeasy.generateSecret).mockReturnValue(mockSecret as any);
      vi.mocked(qrcode.toDataURL).mockResolvedValue('data:image/png;base64,qrcode');
      vi.mocked(cacheHelpers.set).mockResolvedValue(true);

      // Act
      const result = await authService.setupMFA(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.secret).toBe('secret123');
      expect(result.qrCodeUrl).toBe('data:image/png;base64,qrcode');
      expect(result.backupCodes).toHaveLength(8);
    });

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'invalid-user-id';

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' }
            })
          })
        })
      } as any);

      // Act
      const result = await authService.setupMFA(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle MFA already enabled', async () => {
      // Arrange
      const userId = 'user-id';

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                email: 'test@gastat.gov.sa',
                name_en: 'Test User',
                mfa_enabled: true
              },
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await authService.setupMFA(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('MFA already enabled');
    });
  });

  describe('verifyAndEnableMFA', () => {
    it('should verify and enable MFA successfully', async () => {
      // Arrange
      const userId = 'user-id';
      const verificationCode = '123456';
      const setupData = {
        secret: 'secret123',
        backupCodes: ['code1', 'code2']
      };

      vi.mocked(cacheHelpers.get).mockResolvedValue(setupData);
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      } as any);
      vi.mocked(cacheHelpers.del).mockResolvedValue(true);

      // Mock the private verifyMFACode method by making it return true
      const authServiceInstance = authService as any;
      authServiceInstance.verifyMFACode = vi.fn().mockReturnValue(true);

      // Act
      const result = await authService.verifyAndEnableMFA(userId, verificationCode);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle invalid verification code', async () => {
      // Arrange
      const userId = 'user-id';
      const verificationCode = 'invalid';
      const setupData = {
        secret: 'secret123',
        backupCodes: ['code1', 'code2']
      };

      vi.mocked(cacheHelpers.get).mockResolvedValue(setupData);

      // Mock the private verifyMFACode method by making it return false
      const authServiceInstance = authService as any;
      authServiceInstance.verifyMFACode = vi.fn().mockReturnValue(false);

      // Act
      const result = await authService.verifyAndEnableMFA(userId, verificationCode);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle missing setup data', async () => {
      // Arrange
      const userId = 'user-id';
      const verificationCode = '123456';

      vi.mocked(cacheHelpers.get).mockResolvedValue(null);

      // Act
      const result = await authService.verifyAndEnableMFA(userId, verificationCode);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = 'user-id';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { password_hash: 'hashed_password' },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(bcrypt.hash).mockResolvedValue('new_hashed_password');
      vi.mocked(cacheHelpers.del).mockResolvedValue(true);

      // Act
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle invalid current password', async () => {
      // Arrange
      const userId = 'user-id';
      const currentPassword = 'wrongpassword';
      const newPassword = 'newpassword';

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { password_hash: 'hashed_password' },
              error: null
            })
          })
        })
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      // Act
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@gastat.gov.sa',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        name: 'New User',
        department: 'IT'
      };

      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@gastat.gov.sa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: { name: 'New User' }
      };

      vi.mocked(supabaseAnon.auth.signUp).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-user-id',
                email: 'newuser@gastat.gov.sa',
                name_en: 'New User',
                name_ar: 'New User',
                role: 'user',
                department: 'IT',
                is_active: false,
                mfa_enabled: false
              },
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('newuser@gastat.gov.sa');
    });

    it('should handle registration error', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      vi.mocked(supabaseAnon.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email' }
      });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'test@gastat.gov.sa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_metadata: { name: 'Test User' }
        }
      };

      vi.mocked(supabaseAnon.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-id',
                name_en: 'Test User',
                name_ar: 'مستخدم تجريبي',
                role: 'user',
                department: 'IT',
                is_active: true,
                mfa_enabled: false,
                last_login: new Date().toISOString()
              },
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@gastat.gov.sa');
      expect(result?.role).toBe('user');
    });

    it('should return null when no session', async () => {
      // Arrange
      vi.mocked(supabaseAnon.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('checkPermission', () => {
    it('should check admin permissions correctly', async () => {
      // Arrange
      const userId = 'admin-user-id';

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin', department: 'IT' },
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await authService.checkPermission(userId, 'read');

      // Assert
      expect(result).toBe(true);
    });

    it('should check user permissions correctly', async () => {
      // Arrange
      const userId = 'user-id';

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'user', department: 'IT' },
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await authService.checkPermission(userId, 'read');

      // Assert
      expect(result).toBe(true);
    });

    it('should deny invalid permissions', async () => {
      // Arrange
      const userId = 'user-id';

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'user', department: 'IT' },
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await authService.checkPermission(userId, 'admin_action');

      // Assert
      expect(result).toBe(false);
    });
  });
});
